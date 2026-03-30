import ms from "ms";

const zodTransformToMsHelper = (val: string) => {
    const milliseconds = ms(val);
    if (milliseconds === undefined) {
        throw new Error(
            "Invalid expiresWithin format. Checkout 'ms' library on npm for supported formats"
        );
    }
    return milliseconds;
};

export { zodTransformToMsHelper };
