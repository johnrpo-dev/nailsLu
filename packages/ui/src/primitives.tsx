import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

export function Card({ children }: PropsWithChildren) {
  return <section className="panel">{children}</section>;
}

export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`primary-button ${props.className ?? ""}`.trim()} />;
}
