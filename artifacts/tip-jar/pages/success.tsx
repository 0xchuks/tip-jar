import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Success() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const txHash = mounted ? (router.query.txHash as string | undefined) : undefined;

  return (
    <main style={styles.main}>
      <h1 style={styles.heading}>Thanks!</h1>
      <p style={styles.sub}>Your tip was confirmed and verified on-chain.</p>

      {txHash && (
        <div style={styles.card}>
          <p style={styles.label}>Transaction hash</p>
          <p style={styles.hash}>{txHash}</p>
          <a
            href={`https://testnet.monadscan.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            View on MonadScan →
          </a>
        </div>
      )}

      <Link href="/" style={styles.back}>
        ← Back to tip jar
      </Link>
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
  card: {
    border: "1px solid #e5e5e5",
    borderRadius: 8,
    padding: "20px 24px",
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 8,
  },
  hash: {
    fontFamily: "monospace",
    fontSize: 14,
    wordBreak: "break-all",
    marginBottom: 16,
  },
  link: {
    fontSize: 14,
  },
  back: {
    display: "inline-block",
    fontSize: 14,
    color: "#555",
  },
};
