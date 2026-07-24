"use client";

import type React from "react";
import { Input } from "@/components/ui/input";

interface AddressFieldProps {
  placeholder?: string;
  onSelect: (address: string) => void;
  value?: string;
}

const AddressField: React.FC<AddressFieldProps> = ({
  placeholder = "Enter address manually",
  onSelect,
  value = "",
}) => {
  return (
    <Input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onSelect(e.target.value)}
      className="w-full"
    />
  );
};

export default AddressField;
