import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { contractAddress , BASE_RPC_URL} from '@constants/envVariables';
import ABI_JSON from '@/configs/contracts/abi.json';

import { chainConfig } from '@/constants/web3Auth';

const ClaimedABI = [
  'event ClaimFn(bytes32 indexed root, address indexed holder, bytes32 indexed xxx, uint256 amount)',
];

const functionName = 'ClaimFn'

const ifaceClaim = new ethers.utils.Interface(ClaimedABI);

const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);

interface ClaimedData {
  amount: ethers.BigNumber;
  formattedAmount: string;
  holder: string;
  depositReasonCode: string;
}

export const usePayoutData = (txHash: string | undefined) => {
  const [payoutData, setPayoutData] = useState<ClaimedData[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [userData, setData] = useState<number | undefined>(undefined);

  const fetchTxHashData = useCallback(async (holder: string | undefined) => {
    if (!holder) {
      throw new Error('Invalid holder address');
    }
    console.log('holder', holder);

    try {
      const contract = new ethers.Contract(contractAddress, ABI_JSON, provider);
      const points = await contract.balances(holder);

      return points ? Number(points) : 0;
    } catch (error) {
      console.error('Error fetching user points:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while fetching user points',
      );
    }
  }, []);

  const resolvePayoutData = useCallback(async () => {
    if (!txHash) {
      setIsResolving(true);
      return;
    }

    setIsResolving(true);
    setResolveError(null);

    try {
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      const payoutClaimedLogs = receipt.logs.filter(
        (log) => log.topics[0] === ifaceClaim.getEventTopic(functionName),
      );

      const parsedPayoutData = payoutClaimedLogs.map((log) => {
        const parsedLog = ifaceClaim.parseLog(log);
        const amount = parsedLog.args.amount;
        const holder = parsedLog.args.holder;
        const depositReasonCode = parsedLog.args.depositReasonCode;
        return {
          amount,
          formattedAmount: amount,
          holder,
          depositReasonCode: ethers.utils.hexlify(depositReasonCode),
        };
      });
      setPayoutData(parsedPayoutData);
      const userResult = await fetchTxHashData(parsedPayoutData[0]?.holder);
      setData(userResult);
    } catch (err) {
      console.error(err);
      setResolveError(
        err instanceof Error
          ? err.message
          : 'An unknown error occurred while resolving payout data',
      );
    } finally {
      setIsResolving(false);
    }
  }, [txHash]);

  useEffect(() => {
    resolvePayoutData();
  }, [resolvePayoutData]);

  return { payoutData, isResolving, resolveError, resolvePayoutData, userData };
};
