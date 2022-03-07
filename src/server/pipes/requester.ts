import axios, { AxiosRequestConfig, AxiosRequestHeaders, Method } from "axios";

type A = {
    [key: string]: string;
}
const API_SERVICES: A = { discordApi: "https://discord.com/api/v9" };

export default async function <T, R>({
	method,
	url,
	headers,
	data,
	isRawResponse,
	isFile,
	service = "bot"
}: {
    method?: Method;
    url: string;
    headers?: AxiosRequestHeaders;
    data: T;
    isRawResponse?: boolean;
    isFile?: boolean;
    service: string;
}): Promise<R> {
	const config: AxiosRequestConfig = {
		baseURL: API_SERVICES[service],
		responseType: "json",
		withCredentials: true,
		headers: { "Content-Type": "application/json", },
	};

	const Requester = axios.create(config);
	const request: AxiosRequestConfig = {
		method: method || "GET",
		url: url,
		withCredentials: true,
	};
	if (isFile) {
		request.responseType = "arraybuffer";
	}
	if (headers) {
		request.headers = {
			"content-type": "application/json",
			...headers,
		};
	}
	if (request.method === "GET") {
		request.params = data;
	} else {
		request.data = data;
	}
	return Requester(request)
		.then((res) => isRawResponse === true ? res : res.data)
		.catch((err) => {
			throw err;
		});
}
