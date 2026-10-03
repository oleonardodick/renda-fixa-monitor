import { UserModel } from "../models/user.model.js";

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

/**
 * Contrato de acesso aos usuários.
 * Definido na camada de aplicação para permitir implementações substituíveis.
 */
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
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
  };
}