import { createUserSchema, type CreateUserInput } from "@renda-fixa-monitor/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { useSignUp } from "../hooks/useSignUp";

type PasswordField = "password" | "confirmPassword";

export function SignUpForm() {
  const {
    register,
    handleSubmit,
    resetField,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });
  const { submit, errorMessage } = useSignUp();
  const [visiblePasswords, setVisiblePasswords] = useState<Record<PasswordField, boolean>>({
    password: false,
    confirmPassword: false,
  });

  function togglePasswordVisibility(field: PasswordField) {
    setVisiblePasswords((current) => ({ ...current, [field]: !current[field] }));
  }

  return (
    <form
      onSubmit={handleSubmit((values) => submit(values, { setError, resetField, setFocus }))}
      className="flex flex-col gap-4"
      noValidate
    >
      <Field data-invalid={errors.name ? true : undefined}>
        <FieldLabel htmlFor="name">Nome</FieldLabel>
        <Input
          id="name"
          autoComplete="name"
          placeholder="Seu nome"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "name-error" : undefined}
          {...register("name")}
        />
        <FieldError id="name-error">{errors.name?.message}</FieldError>
      </Field>

      <Field data-invalid={errors.email ? true : undefined}>
        <FieldLabel htmlFor="email">E-mail</FieldLabel>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        <FieldError id="email-error">{errors.email?.message}</FieldError>
      </Field>

      <Field data-invalid={errors.password ? true : undefined}>
        <FieldLabel htmlFor="password">Senha</FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="password"
            type={visiblePasswords.password ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Sua senha"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          <InputGroupButton
            onClick={() => togglePasswordVisibility("password")}
            aria-label={visiblePasswords.password ? "Ocultar senha" : "Mostrar senha"}
          >
            {visiblePasswords.password ? <EyeOff /> : <Eye />}
          </InputGroupButton>
        </InputGroup>
        <FieldError id="password-error">{errors.password?.message}</FieldError>
      </Field>

      <Field data-invalid={errors.confirmPassword ? true : undefined}>
        <FieldLabel htmlFor="confirmPassword">Confirmar senha</FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="confirmPassword"
            type={visiblePasswords.confirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repita a senha"
            aria-invalid={errors.confirmPassword ? true : undefined}
            aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
            {...register("confirmPassword")}
          />
          <InputGroupButton
            onClick={() => togglePasswordVisibility("confirmPassword")}
            aria-label={
              visiblePasswords.confirmPassword
                ? "Ocultar confirmação de senha"
                : "Mostrar confirmação de senha"
            }
          >
            {visiblePasswords.confirmPassword ? <EyeOff /> : <Eye />}
          </InputGroupButton>
        </InputGroup>
        <FieldError id="confirmPassword-error">{errors.confirmPassword?.message}</FieldError>
      </Field>

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Criando conta..." : "Criar Conta"}
      </Button>
    </form>
  );
}
