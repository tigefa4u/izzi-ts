type Operations = "+" | "-" | "="

export type RawUpdateProps<T> = {
    [key in keyof T]: {
        op: Operations;
        value: T[key]
    }
}

export type RawUpdateReturnType<T> = {
    [key in keyof T]: string;
}
