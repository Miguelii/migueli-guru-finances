'use client'

import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Eye, EyeOff, Loader2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { trpcClient } from '@/_trpc/client'
import { PRIVATE_ROUTE_PATH } from '@/lib/constants'
import { toast } from 'sonner'
import { loginSchema, type LoginProps } from '@/_bff/modules/auth/auth.dto'

export function AuthCard() {
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()

    const login = trpcClient.auth.login.useMutation({
        onSuccess: () => router.push(PRIVATE_ROUTE_PATH),
        onError: (error) => toast.error(`An error occurred: ${error.message}`),
    })

    const form = useForm<LoginProps>({
        resolver: zodResolver(loginSchema),
    })

    function onSubmit(data: LoginProps) {
        login.mutate(data)
    }

    return (
        <Card className="relative w-full shadow-lg">
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <Controller
                        name="email"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                                <Input
                                    {...field}
                                    id={field.name}
                                    type="email"
                                    aria-invalid={fieldState.invalid}
                                    placeholder="Enter your email"
                                />
                                {fieldState.invalid && (
                                    <FieldError>Please enter a valid email address</FieldError>
                                )}
                            </Field>
                        )}
                    />

                    <Controller
                        name="password"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                                <div className="relative">
                                    <Input
                                        {...field}
                                        id={field.name}
                                        aria-invalid={fieldState.invalid}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-0 top-0 flex h-8 w-10 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        aria-label={
                                            showPassword ? 'Hide password' : 'Show password'
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {fieldState.invalid && (
                                    <FieldError>Please enter a password</FieldError>
                                )}
                            </Field>
                        )}
                    />

                    <Button
                        type="submit"
                        size="lg"
                        className="mt-2 h-11 w-full cursor-pointer text-sm font-semibold"
                        disabled={login.isPending}
                    >
                        {!login.isPending ? (
                            <>
                                <Lock className="h-4 w-4" />
                                Establish Secure Connection
                            </>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Loader2Icon className={'h-4 w-4 animate-spin'} />
                                <span className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                                    Establishing connection...
                                </span>
                            </span>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
