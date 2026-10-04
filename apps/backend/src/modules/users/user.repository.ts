import { DuplicateEmailError } from "../../errors/duplicate-email-error.js";
import { UserModel } from "../../models/user.model.js";

/**
 * Representação de domínio de um usuário.
 * Mantém a lógica de aplicação desacoplada dos documentos do Mongoose.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

/** Dados necessários para persistir um novo usuário. */
export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
}

/**
 * Contrato de acesso aos usuários.
 * Definido na camada de aplicação para permitir implementações substituíveis.
 */
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(user: CreateUserData): Promise<User>;
}

/** Código de erro do MongoDB para violação de índice único. */
const DUPLICATE_KEY_ERROR_CODE = 11000;

function isDuplicateKeyError(error: unknown): boolean {
  return (error as { code?: number } | null)?.code === DUPLICATE_KEY_ERROR_CODE;
}

export function createMongooseUserRepository(): IUserRepository {
  return {
    async findByEmail(email: string): Promise<User | null> {
      const document = await UserModel.findOne({ email: email.toLowerCase() });

      if (!document) {
        return null;
      }

      return {
        id: document._id.toString(),
        name: document.name,
        email: document.email,
        passwordHash: document.passwordHash,
      };
    },

    async create({ name, email, passwordHash }: CreateUserData): Promise<User> {
      try {
        const document = await UserModel.create({ name, email, passwordHash });

        return {
          id: document._id.toString(),
          name: document.name,
          email: document.email,
          passwordHash: document.passwordHash,
        };
      } catch (error) {
        // Requisições simultâneas com o mesmo e-mail violam o índiceúnico do
        // banco. Isso é um conflito de domínio, não uma falha inesperada.
        if (isDuplicateKeyError(error)) {
          throw new DuplicateEmailError();
        }

        throw error;
      }
    },
  };
}
