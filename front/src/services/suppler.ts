import api from "./api";
import { Supplier } from "../types/types";

export const fetchSuppliers = async (
    currentPage: number,
    pageSize: number,
    search: string,
) => {
    const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString(),
    });
    if (search) {
        params.append("search", search);
    }
    const res = await api.get(`/api/inventory/medicines/supplier/?${params.toString()}`);
    return res.data;
};

export const fetchSupplierById = async (id: string) => {
    const res = await api.get(`/api/inventory/medicines/supplier/${id}/`);
    return res.data;
};

export const createSupplier = async (supplier: Supplier) => {
    const res = await api.post(`/api/inventory/medicines/supplier/`, supplier);
    return res.data;
};

export const updateSupplier = async (id: string, supplier: Supplier) => {
    const res = await api.put(`/api/inventory/medicines/supplier/${id}/`, supplier);
    return res.data;
};

export const deleteSupplier = async (id: string) => {
    const res = await api.delete(`/api/inventory/medicines/supplier/${id}/`);
    return res.data;
};