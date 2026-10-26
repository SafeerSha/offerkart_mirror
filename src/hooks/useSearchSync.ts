"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SearchResultData } from "@/lib/types/search";

interface SearchSyncDetail {
  source: string;
  query: string;
  results?: SearchResultData | null;
  timestamp: number;
}

const SEARCH_SYNC_EVENT = "offernearu-search-sync";

// Module-level cache so newly mounted components or scrolled headers immediately get the current query & results
let currentSharedQuery = "";
let currentSharedResults: SearchResultData | null = null;
let lastUpdateTimestamp = 0;
let subscriberCount = 0;

export function resetSearchSync() {
  currentSharedQuery = "";
  currentSharedResults = null;
  lastUpdateTimestamp = 0;
}

export function broadcastSearchSync(
  source: string,
  query: string,
  results?: SearchResultData | null
) {
  currentSharedQuery = query;
  if (results !== undefined) {
    currentSharedResults = results;
  } else if (!query) {
    currentSharedResults = null;
  }
  lastUpdateTimestamp = Date.now();

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<SearchSyncDetail>(SEARCH_SYNC_EVENT, {
        detail: {
          source,
          query,
          results: currentSharedResults,
          timestamp: lastUpdateTimestamp,
        },
      })
    );
  }
}

/**
 * Hook to synchronize search query and results between HeroSection and Header.
 * Ensures that whatever query the user enters is maintained when scrolling down
 * to the sticky header search bar, and vice-versa.
 */
export function useSearchSync(componentId: string) {
  const [searchQuery, setSearchQueryLocal] = useState<string>(() => currentSharedQuery);
  const [searchResults, setSearchResultsLocal] = useState<SearchResultData | null>(
    () => currentSharedResults
  );
  const isInitiatorRef = useRef(false);
  const lastResolvedQueryRef = useRef<string>(
    currentSharedResults && currentSharedQuery ? currentSharedQuery.trim() : ""
  );

  useEffect(() => {
    subscriberCount++;

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<SearchSyncDetail>;
      if (!customEvent.detail || customEvent.detail.source === componentId) return;

      const { query, results } = customEvent.detail;
      isInitiatorRef.current = false;
      setSearchQueryLocal(query);

      if (results !== undefined) {
        setSearchResultsLocal(results);
        if (results && query) {
          lastResolvedQueryRef.current = query.trim();
        } else if (!query) {
          lastResolvedQueryRef.current = "";
        }
      } else if (!query) {
        setSearchResultsLocal(null);
        lastResolvedQueryRef.current = "";
      }
    };

    window.addEventListener(SEARCH_SYNC_EVENT, handleSync);
    return () => {
      subscriberCount--;
      if (subscriberCount <= 0) {
        subscriberCount = 0;
        resetSearchSync();
      }
      window.removeEventListener(SEARCH_SYNC_EVENT, handleSync);
    };
  }, [componentId]);

  const setSearchQuery = useCallback(
    (query: string) => {
      isInitiatorRef.current = true;
      setSearchQueryLocal(query);
      if (!query) {
        setSearchResultsLocal(null);
        lastResolvedQueryRef.current = "";
        broadcastSearchSync(componentId, "", null);
      } else {
        broadcastSearchSync(componentId, query);
      }
    },
    [componentId]
  );

  const setSearchResults = useCallback(
    (results: SearchResultData | null) => {
      setSearchResultsLocal(results);
      if (results && currentSharedQuery) {
        lastResolvedQueryRef.current = currentSharedQuery.trim();
      }
      broadcastSearchSync(componentId, currentSharedQuery, results);
    },
    [componentId]
  );

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isInitiatorRef,
    lastResolvedQueryRef,
  };
}
