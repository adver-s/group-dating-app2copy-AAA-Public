export { }

declare module 'framer-motion' {
    interface HTMLAttributesWithoutMotionProps<T, RefType> {
        className?: string
        src?: string
        alt?: string
    }
}
