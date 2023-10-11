import isEmpty from "lodash/isEmpty";
import cloneDeep from "lodash/cloneDeep";
import { RawUpdateProps, RawUpdateReturnType } from "@customTypes/utility";
import connection from "db";

type G<T> = { [key: string | number]: T }

export const clone = <T>(value: T) => {
	return cloneDeep(value);
};

export const reorderObjectKey = <T>(array: T[], prop: string) => {
	return array.reduce((acc, r) => {
		const key = r[prop as keyof T];
		if (typeof key === "string" || typeof key === "number") {
			acc[key] = r;
		}
		return acc;
	}, {} as G<T>);
};

export const groupByKey = <T>(arr: T[], key: string): {
	[key: string]: T[]
} => {
	const group = arr.reduce((acc: any, val: any) => {
		acc[val[key]] = [ ...(acc[val[key]] || []), val ];
		return acc;
	}, {});
	return group;
};

export const isEmptyObject = (val = {}) => {
	return isEmpty(val);
};

export const isInt = (n: number) => Number(n) === n && n % 1 === 0;
export const isFloat = (n: number) => Number(n) === n && n % 1 !== 0;

export const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
	year: "2-digit",
	month: "short",
	day: "numeric",
};
export const toLocaleDate = (data: string | number) => new Date(data).toLocaleDateString(
	"en-us",
	DATE_OPTIONS
);

export const prepareRawUpdateObject = <T>(data: RawUpdateProps<T>): RawUpdateReturnType<T> => {
	const keys = Object.keys(data);
	const result = {} as RawUpdateReturnType<T>;
	keys.forEach((key) => {
		const obj = data[key as keyof T];
		Object.assign(result, { [key]: connection.raw(`${key} ${obj.op} ??`, [ obj.value as any ]) });
	});
	return result;
};
