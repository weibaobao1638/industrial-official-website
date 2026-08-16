const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

type Primitive = string | number | boolean | null | undefined;
type QueryObject = {
  [key: string]: QueryValue;
};
type QueryValue = Primitive | Primitive[] | QueryObject;

type RequestOptions = {
  path: string;
  params?: Record<string, QueryValue>;
  tags?: string[];
  cache?: RequestCache;
  revalidate?: number | false;
};

type MutateOptions<T> = {
  path: string;
  body: T;
};

function appendParam(searchParams: URLSearchParams, key: string, value: QueryValue) {
  if (value === undefined) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (item !== undefined && item !== null) {
        searchParams.append(key, String(item));
      }
    });
    return;
  }

  if (typeof value === 'object' && value !== null) {
    Object.entries(value).forEach(([childKey, childValue]) => {
      appendParam(searchParams, `${key}[${childKey}]`, childValue);
    });
    return;
  }

  if (value !== null) {
    searchParams.set(key, String(value));
  }
}

function buildUrl(path: string, params?: Record<string, QueryValue>) {
  if (!DIRECTUS_URL) return null;

  const url = new URL(path, DIRECTUS_URL.endsWith('/') ? DIRECTUS_URL : `${DIRECTUS_URL}/`);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    appendParam(url.searchParams, key, value);
  });

  return url;
}

export async function directusRequest<T>({ path, params, tags, cache, revalidate }: RequestOptions): Promise<T | null> {
  const url = buildUrl(path, params);

  if (!url) {
    return null;
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(DIRECTUS_TOKEN ? { Authorization: `Bearer ${DIRECTUS_TOKEN}` } : {}),
    },
    cache,
    next: cache === 'no-store'
      ? undefined
      : (tags || revalidate !== undefined)
        ? { ...(tags ? { tags } : {}), ...(revalidate !== undefined ? { revalidate } : {}) }
        : undefined,
  });

  if (!response.ok) {
    throw new Error(`Directus request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function directusItemsRequest<T>(options: RequestOptions): Promise<T[] | null> {
  const response = await directusRequest<{ data: T[] }>(options);
  return response?.data ?? null;
}

export async function directusItemRequest<T>(options: RequestOptions): Promise<T | null> {
  const response = await directusRequest<{ data: T }>(options);
  return response?.data ?? null;
}

export async function directusCreateItem<TBody extends Record<string, unknown>, TResponse>(
  options: MutateOptions<TBody>,
): Promise<TResponse | null> {
  if (!DIRECTUS_URL) {
    return null;
  }

  const url = buildUrl(options.path);
  if (!url) {
    return null;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(DIRECTUS_TOKEN ? { Authorization: `Bearer ${DIRECTUS_TOKEN}` } : {}),
    },
    body: JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw new Error(`Directus create failed: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as { data?: TResponse };
  return json.data ?? null;
}
