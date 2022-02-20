import { SafeParseQueryProps } from "@customTypes";

export const safeParseQueryParams = <Q, A>(params: SafeParseQueryProps<Q, A>) => {
	const { query, attributes } = params;
	const allowedProps = Object.keys(attributes).map((key) => attributes[key as keyof A].columnName || key);
	Object.keys(query).forEach(key => {
		if (!allowedProps.includes(key)) {
			delete query[key as keyof Q];
		}
	});

	return query;
};