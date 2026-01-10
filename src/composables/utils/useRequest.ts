/* eslint-disable @typescript-eslint/no-explicit-any */
import { i18n } from "@/plugins/i18n";
import axios from "axios";
import { ref } from "vue";

export interface IParams<T> {
  options?: {
    immediate: boolean;
  };
  runServices: (...args: any) => Promise<T>;
}

export function useRequest<T>({
  options = { immediate: false },
  runServices,
}: IParams<T>) {
  const isLoading = ref<boolean>(false);
  const isError = ref<boolean>(false);
  const errorMessage = ref<string>();
  const data = ref<T>();
  const isSuccess = ref<boolean>(false);

  const getErrorMessage = (error: unknown): string => {
    if (typeof error === "string") {
      return error;
    }

    if (axios.isAxiosError(error)) {
      return error.response?.data.messageArguments[0];
    }

    if (error instanceof Error) {
      return error.message;
    }

    return i18n.global.t("GlobalErrorMessage.errorMessage");
  };

  const doRequest = async (...args: any): Promise<T> => {
    isLoading.value = true;
    isError.value = false;
    errorMessage.value = "";
    isSuccess.value = false;

    try {
      data.value = await runServices(...args);
      isSuccess.value = true;
      return data.value;
    } catch (error: unknown) {
      isError.value = true;
      errorMessage.value = getErrorMessage(error);
      isSuccess.value = false;
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  if (options.immediate) {
    doRequest();
  }

  return { data, isLoading, isError, errorMessage, isSuccess, doRequest };
}
