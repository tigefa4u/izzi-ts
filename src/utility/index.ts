import cloneDeep from "lodash/cloneDeep";

type G<T> = { [key: string | number]: T }
export const clone = <T>(value: T) => {
	return cloneDeep(value);
};

export const groupByKey = <T>(array: T[], prop: string) => {
	return array.reduce((acc, r) => {
		const key = r[prop as keyof T];
		acc[key as any] = r;
		return acc;
	}, {} as G<T>);
};