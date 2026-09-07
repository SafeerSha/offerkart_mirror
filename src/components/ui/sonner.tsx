import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      style={{ zIndex: 100000 }}
      toastOptions={{
        classNames: {
          toast:
            "group toast font-medium border shadow-lg rounded-xl flex items-center gap-3 !bg-opacity-100 !backdrop-blur-none",
          default: "!bg-white text-gray-900 border-gray-200",
          success: "!bg-green-50 !text-green-800 !border-green-200",
          error: "!bg-red-50 !text-red-800 !border-red-200",
          warning: "!bg-yellow-50 !text-yellow-800 !border-yellow-200",
          info: "!bg-blue-50 !text-blue-800 !border-blue-200",
          loading: "!bg-white !text-gray-900 !border-gray-200",
          description: "group-[.toast]:text-muted-foreground text-xs",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
