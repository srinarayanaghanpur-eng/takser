import { View, Text, TouchableOpacity, TextInput, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { format } from "date-fns";

interface DateTimeFieldProps {
  value: Date;
  onChange: (date: Date) => void;
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DateTimeField({ value, onChange }: DateTimeFieldProps) {
  const [show, setShow] = useState(false);

  if (Platform.OS === "web") {
    return (
      <input
        type="datetime-local"
        value={toLocalInputValue(value)}
        onChange={(e: any) => {
          const parsed = new Date(e.target.value);
          if (!isNaN(parsed.getTime())) onChange(parsed);
        }}
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 14,
          padding: 14,
          fontSize: 15,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          width: "100%",
          boxSizing: "border-box",
        }}
      />
    );
  }

  return (
    <View>
      <TouchableOpacity
        onPress={() => setShow(true)}
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 14,
          padding: 14,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: "600", color: "#0F172A" }}>
          {format(value, "MMM d, yyyy h:mm a")}
        </Text>
        <Text style={{ fontSize: 16 }}>📅</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value}
          mode="datetime"
          display="default"
          minimumDate={new Date()}
          onChange={(_, selected) => {
            setShow(Platform.OS === "ios");
            if (selected) onChange(selected);
          }}
        />
      )}
    </View>
  );
}
