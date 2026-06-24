"use client";



import { useEffect } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchProductDetail, type ProductDetailResult } from "@/services/product.service";



function needsMerchandising(data: ProductDetailResult | null | undefined): boolean {

  if (!data?.product) return false;

  return (

    data.similarProducts.length === 0 &&

    data.relatedProducts.length === 0 &&

    data.frequentlyBoughtTogether.length === 0

  );

}



export function useProduct(slug: string, initialData?: ProductDetailResult | null) {

  const queryClient = useQueryClient();

  const hasInitialProduct = Boolean(initialData?.product);



  const query = useQuery({

    queryKey: ["product", slug],

    queryFn: () => fetchProductDetail(slug),

    enabled: Boolean(slug) && !hasInitialProduct,

    initialData: hasInitialProduct ? initialData! : undefined,

    staleTime: 5 * 60_000,

    gcTime: 10 * 60_000,

    refetchOnWindowFocus: false,

    refetchOnMount: false,

  });



  useEffect(() => {

    if (!slug || !hasInitialProduct || !needsMerchandising(initialData)) {

      return;

    }



    let cancelled = false;



    const run = () => {
      // #region agent log
      const _clientFetchStart = Date.now();
      fetch('http://127.0.0.1:7828/ingest/1d696600-63a8-447a-b1d2-58422acef253',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'88ed4c'},body:JSON.stringify({sessionId:'88ed4c',location:'useProduct.ts:idle',message:'client merchandising fetch start',data:{slug},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      void fetchProductDetail(slug).then((full) => {
        // #region agent log
        fetch('http://127.0.0.1:7828/ingest/1d696600-63a8-447a-b1d2-58422acef253',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'88ed4c'},body:JSON.stringify({sessionId:'88ed4c',location:'useProduct.ts:idle',message:'client merchandising fetch done',data:{slug,ok:Boolean(full),ms:Date.now()-_clientFetchStart},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
        if (cancelled || !full) return;

        queryClient.setQueryData(["product", slug], full);

      });

    };



    if (typeof window.requestIdleCallback === "function") {

      const idleId = window.requestIdleCallback(run, { timeout: 2500 });

      return () => {

        cancelled = true;

        window.cancelIdleCallback(idleId);

      };

    }



    const timer = window.setTimeout(run, 300);

    return () => {

      cancelled = true;

      window.clearTimeout(timer);

    };

  }, [slug, hasInitialProduct, initialData, queryClient]);



  return query;

}


