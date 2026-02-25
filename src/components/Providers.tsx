"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000, // 5 minutes cache
                        refetchInterval: 15 * 60 * 1000, // Background poll every 15 mins
                        retry: 2,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}
