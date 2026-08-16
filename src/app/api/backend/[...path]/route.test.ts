import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { CACHE_TAGS } from "@/lib/api/cache-tags";

const { getTokenMock, revalidateTagMock } = vi.hoisted(() => ({
  getTokenMock: vi.fn(),
  revalidateTagMock: vi.fn(),
}));

vi.mock("next-auth/jwt", () => ({
  getToken: getTokenMock,
}));

vi.mock("next/cache", () => ({
  revalidateTag: revalidateTagMock,
}));

vi.mock("@/lib/config.server", () => ({
  config: {
    api: { upstreamBaseUrl: "https://api.example.com" },
    auth: { secret: "test-secret" },
  },
}));

import { GET, PATCH, POST, DELETE } from "./route";

describe("backend proxy revalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTokenMock.mockResolvedValue({ accessToken: "token-123" });
    global.fetch = vi.fn();
  });

  it("revalidates offer tags after a successful merchant offer mutation", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const request = new NextRequest("http://localhost/api/backend/business/offer/42", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Summer Deal" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ path: ["business", "offer", "42"] }),
    });

    expect(response.status).toBe(200);
    expect(revalidateTagMock).toHaveBeenCalledTimes(3);
    expect(revalidateTagMock).toHaveBeenNthCalledWith(1, CACHE_TAGS.HOME, "max");
    expect(revalidateTagMock).toHaveBeenNthCalledWith(2, CACHE_TAGS.OFFERS, "max");
    expect(revalidateTagMock).toHaveBeenNthCalledWith(3, CACHE_TAGS.OFFER("42"), "max");
  });

  it("revalidates product tags for offerproduct inactivate mutations", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const request = new NextRequest("http://localhost/api/backend/business/offerproduct/inactivate/77", {
      method: "PATCH",
      headers: { authorization: "Bearer fallback-token" },
    });

    getTokenMock.mockResolvedValue(null);

    await PATCH(request, {
      params: Promise.resolve({ path: ["business", "offerproduct", "inactivate", "77"] }),
    });

    expect(revalidateTagMock).toHaveBeenCalledTimes(2);
    expect(revalidateTagMock).toHaveBeenNthCalledWith(1, CACHE_TAGS.PRODUCTS, "max");
    expect(revalidateTagMock).toHaveBeenNthCalledWith(2, CACHE_TAGS.PRODUCT("77"), "max");
  });

  it("does not revalidate tags for successful GET requests", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const request = new NextRequest("http://localhost/api/backend/business/offer/42", {
      method: "GET",
      headers: { authorization: "Bearer token-123" },
    });

    const response = await GET(request, {
      params: Promise.resolve({ path: ["business", "offer", "42"] }),
    });

    expect(response.status).toBe(200);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it("does not revalidate tags when the upstream mutation fails", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "failure" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      })
    );

    const request = new NextRequest("http://localhost/api/backend/business/shop/9", {
      method: "DELETE",
      headers: { authorization: "Bearer token-123" },
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ path: ["business", "shop", "9"] }),
    });

    expect(response.status).toBe(500);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });
});

describe("backend proxy shopId spoofing protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
  });

  it("overrides client-supplied shopId with the authenticated token shopId", async () => {
    getTokenMock.mockResolvedValue({
      accessToken: "valid-token",
      shopId: "legitimate-shop-123",
    });

    const request = new NextRequest("http://localhost/api/backend/business/offer", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "shopId": "attacker-spoofed-shop-999",
      },
      body: JSON.stringify({ title: "New Offer" }),
    });

    await POST(request, {
      params: Promise.resolve({ path: ["business", "offer"] }),
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const fetchHeaders = fetchCall[1]?.headers as Headers;

    expect(fetchHeaders.get("shopId")).toBe("legitimate-shop-123");
  });

  it("strips client-supplied shopId if JWT token does not contain shopId", async () => {
    getTokenMock.mockResolvedValue({
      accessToken: "valid-token",
    });

    const request = new NextRequest("http://localhost/api/backend/business/offer", {
      method: "GET",
      headers: {
        "shopid": "attacker-spoofed-shop-999",
      },
    });

    await GET(request, {
      params: Promise.resolve({ path: ["business", "offer"] }),
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const fetchHeaders = fetchCall[1]?.headers as Headers;

    expect(fetchHeaders.get("shopId")).toBeNull();
    expect(fetchHeaders.get("shopid")).toBeNull();
  });
});

