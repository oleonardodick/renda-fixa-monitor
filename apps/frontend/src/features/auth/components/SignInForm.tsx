import { signInSchema, type SignInInput } from "@renda-fixa-monitor/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useSignIn } from "../hooks/useSignIn";
import { InputGroup, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function SignInForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const { submit, errorMessage } = useSignIn();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      <Field data-invalid={errors.email ? true : undefined}>
        <FieldLabel htmlFor="email">E-mail</FieldLabel>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          aria-invalid={errors.email ? true : undefined}
          {...register("email")}
        />
        <FieldError>{errors.email?.message}</FieldError>
      </Field>

      <Field data-invalid={errors.password ? true : undefined}>
        <FieldLabel htmlFor="password">Senha</FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="password"
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Sua senha"
            aria-invalid={errors.password ? true : undefined}
            {...register("password")}
          />
          <InputGroupButton onClick={() => setIsPasswordVisible((current) => !current)}>
            {isPasswordVisible ? <EyeOff /> : <Eye />}
          </InputGroupButton>
        </InputGroup>
        <FieldError>{errors.password?.message}</FieldError>
      </Field>

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Entrando..." : "Confirmar"}
      </Button>
    </form>
  );
}
