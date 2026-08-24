/**
 * Every command the vocabulary declares, mapped to the code that runs it.
 *
 * `CommandRegistry` is `Record<CommandName, CommandHandler>`, so this object is
 * exhaustiveness-checked against `@mcmec/domain`: add a definition there and this file stops
 * compiling until it is implemented. That compile error is the entire safety mechanism of the
 * define/implement split (#135 Q6).
 *
 * Empty while the vocabulary is — each slice adds its handlers here alongside its definitions.
 */
import type { CommandRegistry } from "./types";

export const REGISTRY: CommandRegistry = {};
