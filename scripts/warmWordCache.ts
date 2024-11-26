import * as dotenv from "dotenv";
import { DEFAULT_WORD_LIST } from "../src/constants";

// Load environment variables
dotenv.config();

const API_URL = "https://jbbhyxtpholdwrxencjx.supabase.co/functions/v1/";
const MAX_CONCURRENT_REQUESTS = 10;

class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const nextResolve = this.queue.shift();
      nextResolve?.();
    } else {
      this.permits++;
    }
  }
}

async function processWord(
  word: string,
  semaphore: Semaphore,
): Promise<void> {
  await semaphore.acquire();
  try {
    console.log(`Processing word: ${word}`);

    const response = await fetch(API_URL + "nearest-words", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SECRET}`,
      },
      body: JSON.stringify({ word }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log(`Successfully processed: ${word}`);
  } catch (error) {
    console.error(`Error processing word "${word}":`, error);
  } finally {
    semaphore.release();
  }
}

async function warmCache() {
  console.log("Starting cache warming...");
  const semaphore = new Semaphore(MAX_CONCURRENT_REQUESTS);

  const promises = DEFAULT_WORD_LIST.map((word) =>
    processWord(word, semaphore)
  );

  await Promise.all(promises);

  console.log("Cache warming completed!");
}

// Run the cache warmer
warmCache().catch(console.error);