import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { Pagination } from "@/lib/ceir-helpers";

export type OrderHistoryConfig = {
  category: string;
  limit?: number;
  statusOptions?: string[];
};

export type OrderHistoryState<T> = {
  orders: T[];
  pagination: Pagination;
  loading: boolean;
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  page: number;
  setPage: (v: number | ((p: number) => number)) => void;
  selectedOrder: T | null;
  setSelectedOrder: (o: T | null) => void;
  handleCloseDetail: () => void;
  allStatuses: string[];
};

const DEFAULT_PAGINATION: Pagination = { total: 0, page: 1, limit: 20, totalPages: 1 };
const DEFAULT_STATUSES = ["SUCCESS", "PROCESSING", "PENDING", "PENDING_PAYMENT", "FAILED", "EXPIRED"];

export function useOrderHistory<T extends { orderId: string }>(
  config: OrderHistoryConfig,
): OrderHistoryState<T> {
  const { category, limit = 20, statusOptions } = config;

  const [orders, setOrders] = useState<T[]>([]);
  const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<T | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category,
        page: page.toString(),
        limit: limit.toString(),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/orders/history?${params}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
        setPagination(data.pagination ?? DEFAULT_PAGINATION);
      }
    } catch {}
    finally { setLoading(false); }
  }, [category, page, limit, debouncedSearch, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId || autoOpenedRef.current || loading || orders.length === 0) return;
    const target = orders.find(o => o.orderId === openId);
    if (target) {
      setSelectedOrder(target);
      autoOpenedRef.current = true;
    }
  }, [searchParams, orders, loading]);

  const handleCloseDetail = useCallback(() => {
    setSelectedOrder(null);
    if (searchParams.get("open")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("open");
      navigate(url.pathname + url.search, { replace: true });
    }
  }, [searchParams, navigate]);

  return {
    orders,
    pagination,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    selectedOrder,
    setSelectedOrder,
    handleCloseDetail,
    allStatuses: statusOptions ?? DEFAULT_STATUSES,
  };
}

