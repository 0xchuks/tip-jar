import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";

const TIP_BUTTONS = [
  { button: 1 as const, label: "0.01 MON", value: "0.01" },
  { button: 2 as const, label: "0.05 MON", value: "0.05" },
  { button: 3 as const, label: "0.1 MON", value: "0.1" },
] as const;

export default function Home() {
  const router = useRouter();
  const { isConnected } = useAccount();

  const [mounted, setMounted] = useState(false);
  const [recipient, setRecipient] = useState<string | null>(null);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [selectedButton, setSelectedButton] = useState<1 | 2 | 3 | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const verificationStarted = useRef(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/recipient")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setRecipientError(data.error as string);
        else setRecipient(data.address as string);
      })
      .catch(() => setRecipientError("Failed to contact the server. Please refresh."));
  }, []);

  const {
    sendTransaction,
    data: txHash,
    isPending: isSending,
    error: sendError,
    reset: resetSend,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (!isConfirmed || !txHash || selectedButton === null) return;
    if (verificationStarted.current) return;
    verificationStarted.current = true;

    setStatusMsg("Verifying on-chain payment...");
    fetch("/api/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txHash, button: selectedButton }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const data = (await r.json()) as { error: string };
          setVerifyError(data.error ?? "Verification failed.");
          setStatusMsg("");
        } else {
          void router.push(`/success?txHash=${txHash}`);
        }
      })
      .catch(() => {
        setVerifyError("Verification request failed. Check your connection.");
        setStatusMsg("");
      });
  }, [isConfirmed, txHash, selectedButton, router]);

  const handleTip = (button: 1 | 2 | 3, value: string) => {
    if (!recipient) return;
    resetSend();
    verificationStarted.current = false;
    setSelectedButton(button);
    setVerifyError("");
    setStatusMsg("Waiting for wallet confirmation...");
    sendTransaction({
      to: recipient as `0x${string}`,
      value: parseEther(value),
    });
  };

  return (
    <main style={styles.main}>
      <h1 style={styles.heading}>Tip Jar</h1>
      <p style={styles.sub}>Send a tip on Monad Testnet</p>

      <div style={styles.connectRow}>
        {mounted && <ConnectButton />}
      </div>

      {mounted && recipientError && (
        <p style={styles.error}>{recipientError}</p>
      )}

      {mounted && isConnected && recipient && !recipientError && (
        <div style={styles.buttonGroup}>
          {TIP_BUTTONS.map(({ button, label, value }) => {
            const isThisButton = selectedButton === button;
            const busy = isSending || isConfirming;
            return (
              <button
                key={button}
                onClick={() => handleTip(button, value)}
                disabled={busy}
                style={{
                  ...styles.tipButton,
                  opacity: busy ? 0.6 : 1,
                  cursor: busy ? "not-allowed" : "pointer",
                }}
              >
                {isThisButton && (isSending || isConfirming)
                  ? isSending
                    ? "Confirm in wallet…"
                    : "Confirming…"
                  : label}
              </button>
            );
          })}
        </div>
      )}

      {mounted && statusMsg && <p style={styles.status}>{statusMsg}</p>}

      {mounted && sendError && !verifyError && (
        <p style={styles.error}>
          {sendError.message.split("\n")[0] ?? "Transaction failed."}
        </p>
      )}

      {mounted && verifyError && (
        <p style={styles.error}>{verifyError}</p>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    maxWidth: 480,
    margin: "80px auto",
    padding: "0 24px",
  },
  heading: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 4,
  },
  sub: {
    color: "#555",
    marginBottom: 32,
  },
  connectRow: {
    marginBottom: 32,
  },
  buttonGroup: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  tipButton: {
    padding: "12px 24px",
    fontSize: 16,
    fontFamily: "inherit",
    border: "1px solid #ccc",
    borderRadius: 6,
    background: "#fff",
    color: "#111",
  },
  status: {
    marginTop: 20,
    color: "#555",
  },
  error: {
    marginTop: 20,
    color: "#c00",
  },
};
