"use client";

import { useState, type ReactElement } from "react";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AvatarPicker,
  buildUrl,
  parseAvatarUrl,
  randomBuild,
  DEFAULT_BUILD,
  type AvatarBuild,
} from "./AvatarPicker";

interface AvatarPickerDialogProps {
  value: string | undefined;
  // Se llama SOLO al confirmar («Usar este avatar») y solo si el usuario tocó algo.
  onChange: (url: string | undefined) => void;
  // Elemento disparador (botón) que abre el diálogo. base-ui lo renderiza en su sitio.
  trigger: ReactElement;
}

// Envuelve el personalizador por rasgos en un diálogo con borrador. El estado del
// avatar (`build`) vive aquí, no en el `AvatarPicker`, para poder pintar el preview
// en la cabecera fija mientras los selectores scrollean — así el avatar nunca se
// pierde de vista. Los ajustes solo se persisten al confirmar. Compartido por el
// formulario de alta (`PersonForm`) y la ficha de persona.
export function AvatarPickerDialog({ value, onChange, trigger }: AvatarPickerDialogProps) {
  const [open, setOpen] = useState(false);
  const [build, setBuild] = useState<AvatarBuild>(() => parseAvatarUrl(value) ?? DEFAULT_BUILD);
  // `touched` distingue "el usuario eligió algo" de "solo abrió y ve el preview por
  // defecto": sin esto, confirmar sin tocar nada guardaría el avatar por defecto y se
  // perdería el fallback de iniciales.
  const [touched, setTouched] = useState(false);

  const apply = (next: AvatarBuild) => {
    setBuild(next);
    setTouched(true);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Al abrir, re-sembrar desde el valor actual (descarta ajustes de una
        // apertura anterior que se cancelara).
        if (next) {
          setBuild(parseAvatarUrl(value) ?? DEFAULT_BUILD);
          setTouched(false);
        }
        setOpen(next);
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {/* Preview + Aleatorio fijos junto al título: visibles aunque se
                scrollee la lista de selectores. */}
            <img
              src={buildUrl(build)}
              alt="Vista previa del avatar"
              className="size-14 shrink-0 rounded-full bg-muted ring-1 ring-border"
            />
            <div className="min-w-0 space-y-2">
              <DialogTitle>Personalizar avatar</DialogTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => apply(randomBuild())}
                className="gap-1.5"
              >
                <Shuffle className="size-3.5" aria-hidden />
                Aleatorio
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Scroll interno — no en el div redondeado del diálogo, o el scrollbar
            quedaría fuera de las esquinas en Chrome/Windows. */}
        <div className="-mx-1 max-h-[55vh] overflow-y-auto px-1">
          <AvatarPicker build={build} onBuildChange={apply} />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancelar</Button>} />
          <Button
            type="button"
            onClick={() => {
              if (touched) onChange(buildUrl(build));
              setOpen(false);
            }}
          >
            Usar este avatar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
