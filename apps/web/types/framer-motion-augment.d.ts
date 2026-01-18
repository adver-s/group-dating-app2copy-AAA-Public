export { }

declare module 'framer-motion' {
    interface HTMLMotionProps<T> {
        className?: string
        src?: string
        alt?: string
    }
}
