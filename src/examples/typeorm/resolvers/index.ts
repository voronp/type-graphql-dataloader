import { NonEmptyArray } from "type-graphql";
import CertResolver from "./CertResolver.js";
import CompanyResolver from "./CompanyResolver.js";
import DeskResolver from "./DeskResolver.js";
import EmployeeResolver from "./EmployeeResolver.js";

export default [
  CompanyResolver,
  DeskResolver,
  EmployeeResolver,
  CertResolver,
] as NonEmptyArray<Function>;
