import { Router } from "express";
import { createPublicClient, http, defineChain } from "viem";

const router = Router();

const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "MonadScan", url: "https://testnet.monadscan.com" },
  },
  testnet: true,
});

const MONAD_RPC = "https://testnet-rpc.monad.xyz";
const CHAIN_ID = 10143;

const TIP_AMOUNTS: Record<number, bigint> = {
  1: 10000000000000000n,   // 0.01 MON in wei
  2: 50000000000000000n,   // 0.05 MON in wei
  3: 100000000000000000n,  // 0.10 MON in wei
};

const seenHashes = new Set<string>();

router.post("/verify-payment", async (req, res) => {
  const { txHash, button } = req.body as { txHash: unknown; button: unknown };

  if (typeof txHash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    res.status(400).json({ error: "Invalid txHash format." });
    return;
  }

  const buttonNum = Number(button);
  if (!Number.isInteger(buttonNum) || ![1, 2, 3].includes(buttonNum)) {
    res.status(400).json({ error: "Button must be 1, 2, or 3." });
    return;
  }

  const expectedWei = TIP_AMOUNTS[buttonNum]!;

  const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS;
  if (!RECIPIENT_ADDRESS) {
    req.log.error("RECIPIENT_ADDRESS environment variable is not set");
    res.status(500).json({ error: "Recipient address is not configured on the server." });
    return;
  }

  if (seenHashes.has(txHash.toLowerCase())) {
    res.status(400).json({ error: "This transaction hash has already been used." });
    return;
  }

  const client = createPublicClient({
    chain: monadTestnet,
    transport: http(MONAD_RPC),
  });

  let tx: Awaited<ReturnType<typeof client.getTransaction>>;
  let receipt: Awaited<ReturnType<typeof client.getTransactionReceipt>>;

  try {
    [tx, receipt] = await Promise.all([
      client.getTransaction({ hash: txHash as `0x${string}` }),
      client.getTransactionReceipt({ hash: txHash as `0x${string}` }),
    ]);
  } catch (err) {
    req.log.error({ err, txHash }, "Failed to fetch transaction from Monad testnet");
    res.status(400).json({ error: "Could not fetch transaction from Monad testnet. Is the hash correct and confirmed?" });
    return;
  }

  if (receipt.status !== "success") {
    res.status(400).json({ error: "Transaction did not succeed on-chain." });
    return;
  }

  if (!tx.to || tx.to.toLowerCase() !== RECIPIENT_ADDRESS.toLowerCase()) {
    res.status(400).json({ error: "Transaction recipient does not match the tip jar address." });
    return;
  }

  if (tx.value < expectedWei) {
    res.status(400).json({
      error: `Transaction value is less than the expected amount for button ${buttonNum}.`,
    });
    return;
  }

  if (tx.chainId !== CHAIN_ID) {
    res.status(400).json({ error: "Transaction is not on Monad testnet (chain ID 10143)." });
    return;
  }

  seenHashes.add(txHash.toLowerCase());

  req.log.info({ txHash, button: buttonNum }, "Payment verified successfully");
  res.json({ ok: true, txHash });
});

export default router;
