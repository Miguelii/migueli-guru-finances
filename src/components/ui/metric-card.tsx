import type { LucideIcon } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import Image from 'next/image'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type IconProps = { icon: LucideIcon; imgSrc?: never }
type ImgProps = { icon?: never; imgSrc: { src: string | null; alt: string } }

type Props = PropsWithChildren<
    {
        /** Card title displayed in the header */
        title: string
        titleColor?: string
    } & (IconProps | ImgProps)
>

/**
 * Generic metric card with a header (title + icon/image) and composable content area.
 * Pass either `icon` (LucideIcon) or `imgSrc` ({ src, alt }) — not both.
 * @param props - Card title, icon or imgSrc, and children
 */
export function MetricCard({ title, icon: Icon, imgSrc, children, titleColor }: Props) {
    return (
        <Card className="cursor-pointer gap-0 py-0 hover:shadow-md hover:border-border/80 transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between rounded-t-xl border-b bg-muted/50 py-3!">
                <CardTitle
                    className="text-sm font-medium text-muted-foreground"
                    style={{
                        color: titleColor ?? undefined,
                    }}
                >
                    {title}
                </CardTitle>
                {Icon ? (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <>
                        {imgSrc.src && (
                            <Image
                                src={imgSrc.src}
                                alt={imgSrc.alt}
                                width={16}
                                height={16}
                                className="rounded-none"
                                unoptimized
                            />
                        )}
                    </>
                )}
            </CardHeader>
            <CardContent className="space-y-2 py-4">{children}</CardContent>
        </Card>
    )
}

export function MetricCardSkeleton() {
    return (
        <Card className="gap-0 py-0">
            <CardHeader className="flex flex-row items-center justify-between rounded-t-xl border-b bg-muted/50 py-3!">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-none" />
            </CardHeader>
            <CardContent className="space-y-2 py-4">
                <Skeleton className="h-8 w-32" />
                <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </CardContent>
        </Card>
    )
}
