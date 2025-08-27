const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://apisalestalk.onrender.com"

export type Product = {
  id: string
  name: string
  price: number
  status: "active" | "inactive" | string
  created_at: string | null
  [key: string]: any
}

export type CreateProductDTO = {
  name: string
  price: number
  status?: "active" | "inactive"
}

export type UpdateProductDTO = Partial<CreateProductDTO>

async function handleResponse<T>(res: Response, context: string): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`${context} ${res.status} ${res.statusText} ${text}`)
  }
  // 204 No Content
  if (res.status === 204) return undefined as unknown as T
  const data = (await res.json().catch(() => null)) as T
  return data
}

function authHeaders(token: string) {
  return {
    accept: "application/json",
    "content-type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

export const productService = {
  // LIST
  async getProducts(token: string, limit = 50): Promise<Product[]> {
    const url = `${API_BASE_URL}/products?limit=${limit}`
    const res = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })
    const data = await handleResponse<Product[] | { items?: Product[] }>(
      res,
      "GET /products"
    )
    if (Array.isArray(data)) return data
    if (Array.isArray((data as any)?.items)) return (data as any).items
    return []
  },

  // GET BY ID
  async getProductById(token: string, productId: string): Promise<Product> {
    const url = `${API_BASE_URL}/products/${productId}`
    const res = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })
    return handleResponse<Product>(res, `GET /products/${productId}`)
  },

  // CREATE
  async createProduct(
    token: string,
    payload: CreateProductDTO
  ): Promise<Product> {
    const url = `${API_BASE_URL}/products`
    const res = await fetch(url, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
      cache: "no-store",
    })
    return handleResponse<Product>(res, "POST /products")
  },

  // UPDATE
  async updateProduct(
    token: string,
    productId: string,
    payload: UpdateProductDTO
  ): Promise<Product> {
    const url = `${API_BASE_URL}/products/${productId}`
    const res = await fetch(url, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
      cache: "no-store",
    })
    return handleResponse<Product>(res, `PUT /products/${productId}`)
  },

  // DELETE
  async deleteProduct(token: string, productId: string): Promise<boolean> {
    const url = `${API_BASE_URL}/products/${productId}`
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })
    await handleResponse<void>(res, `DELETE /products/${productId}`)
    return true
  },

  // FIND BY NAME (prefijo)
  async findByName(
    token: string,
    name: string,
    limit = 50
  ): Promise<Product[]> {
    const url = `${API_BASE_URL}/products/search/by-name?name=${encodeURIComponent(
      name
    )}&limit=${limit}`
    const res = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })
    return handleResponse<Product[]>(
      res,
      `GET /products/search/by-name?name=${name}`
    )
  },

  // GET NAME BY ID
  async getNameById(
    token: string,
    productId: string
  ): Promise<{ id: string; name: string }> {
    const url = `${API_BASE_URL}/products/${productId}/name`
    const res = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })
    return handleResponse<{ id: string; name: string }>(
      res,
      `GET /products/${productId}/name`
    )
  },

  // Helper opcional: cambiar estado rápido
  async toggleStatus(
    token: string,
    product: Product
  ): Promise<Product> {
    const next =
      product.status === "active" ? ("inactive" as const) : ("active" as const)
    return this.updateProduct(token, product.id, { status: next })
  },
}