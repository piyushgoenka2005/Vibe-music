import { NextResponse } from "next/server";
import { loadProductDetailPage } from "@/lib/server/productDetailLoader";
import { debugSessionLog } from "@/lib/debugSessionLog";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    // #region agent log
    const _apiStart = Date.now();
    fetch('http://127.0.0.1:7828/ingest/1d696600-63a8-447a-b1d2-58422acef253',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'88ed4c'},body:JSON.stringify({sessionId:'88ed4c',location:'api/products/[slug]/route.ts',message:'PDP API start',data:{slug},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    debugSessionLog({ location: "api/products/[slug]", message: "PDP API start", hypothesisId: "H3", data: { slug } });
    // #endregion
    const data = await loadProductDetailPage(slug);
    // #region agent log
    fetch('http://127.0.0.1:7828/ingest/1d696600-63a8-447a-b1d2-58422acef253',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'88ed4c'},body:JSON.stringify({sessionId:'88ed4c',location:'api/products/[slug]/route.ts',message:'PDP API done',data:{slug,found:Boolean(data),ms:Date.now()-_apiStart,hasMerch:Boolean(data?.relatedProducts?.length||data?.similarProducts?.length)},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    debugSessionLog({ location: "api/products/[slug]", message: "PDP API done", hypothesisId: "H3", data: { slug, found: Boolean(data), ms: Date.now() - _apiStart } });
    // #endregion

    if (!data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=45, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
