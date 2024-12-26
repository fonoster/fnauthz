/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { z } from "zod";
import { AccountType } from "./type";

const voiceRequestSchema = z.object({
  accessKeyId: z.string()
});

const userExtendedSchema = z.object({
  ref: z.string(),
  extended: z.object({
    accountType: z.nativeEnum(AccountType),
    callingEnabled: z.boolean(),
    stripeCustomerId: z.string()
  })
});

const checkMethodAuthorizedRequestSchema = z.object({
  accessKeyId: z.string(),
  method: z.string()
});

// AddBillingMeterEventRequest
const addBillingMeterEventRequestSchema = z.object({
  accessKeyId: z.string(),
  payload: z.object({
    value: z.number(),
    identifier: z.string()
  })
});

export {
  addBillingMeterEventRequestSchema,
  voiceRequestSchema,
  userExtendedSchema,
  checkMethodAuthorizedRequestSchema
};
