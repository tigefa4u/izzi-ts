export type ReferralProps = {
    id: number;
    metadata?: any;
    user_tag: string;
    referred_to: string;
    is_deleted?: boolean;
    username?: string;
};

export type ReferralCreateProps = Omit<ReferralProps, "id">;

export type ReferralParamProps = Pick<ReferralProps, "user_tag" | "referred_to" | "id">