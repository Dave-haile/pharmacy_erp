import api from "./api";



export const fetchCategories = async (
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

  const res = await api.get(
    `/api/inventory/medicine-categories/?${params.toString()}`,
  );

  return res.data;
};



