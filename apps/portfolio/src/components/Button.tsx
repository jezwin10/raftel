import type { ButtonHTMLAttributes } from "react"

type Props = {
    variant?: "primary" | "secondary" | "ghost"
} & ButtonHTMLAttributes<HTMLButtonElement>

export function Button({
    variant = "primary",
    ...props
}: Props) {
    return (
        <button
            className={`button button-${variant}`}
                {...props}
        />
    )
}