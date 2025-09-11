import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onTimeSelect: (time: string) => void;
  selectedTime?: string;
}

const TimePicker = ({ isOpen, onClose, onTimeSelect, selectedTime }: TimePickerProps) => {
  const [selectedHour, setSelectedHour] = useState<number>(7);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">("AM");

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const formatTime = (hour: number, minute: number, period: string) => {
    const formattedMinute = minute.toString().padStart(2, '0');
    return `${hour}:${formattedMinute} ${period}`;
  };

  const handleOk = () => {
    const timeString = formatTime(selectedHour, selectedMinute, selectedPeriod);
    onTimeSelect(timeString);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-medium tracking-wider">
            ENTER TIME
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center justify-center gap-4 py-8">
          {/* Hour Selector */}
          <div className="text-center">
            <div 
              className="border-2 border-primary rounded-lg p-4 min-w-[80px] bg-background cursor-pointer hover:bg-primary/5"
              onClick={() => {
                const hourSelect = document.getElementById('hour-select');
                hourSelect?.classList.toggle('hidden');
              }}
            >
              <div className="text-4xl font-light mb-2">{selectedHour}</div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Hour</p>
          </div>

          {/* Separator */}
          <div className="text-4xl font-light">:</div>

          {/* Minute Selector */}
          <div className="text-center">
            <div 
              className="border border-gray-300 rounded-lg p-4 min-w-[80px] bg-gray-100 cursor-pointer hover:bg-gray-200"
              onClick={() => {
                const minuteSelect = document.getElementById('minute-select');
                minuteSelect?.classList.toggle('hidden');
              }}
            >
              <div className="text-4xl font-light mb-2">{selectedMinute.toString().padStart(2, '0')}</div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Minute</p>
          </div>

          {/* AM/PM Selector */}
          <div className="flex flex-col gap-1">
            <Button
              variant={selectedPeriod === "AM" ? "default" : "outline"}
              size="sm"
              className={cn(
                "min-w-[60px]",
                selectedPeriod === "AM" 
                  ? "bg-primary/20 text-primary border-primary" 
                  : "border-gray-300"
              )}
              onClick={() => setSelectedPeriod("AM")}
            >
              AM
            </Button>
            <Button
              variant={selectedPeriod === "PM" ? "default" : "outline"}
              size="sm"
              className={cn(
                "min-w-[60px]",
                selectedPeriod === "PM" 
                  ? "bg-primary/20 text-primary border-primary" 
                  : "border-gray-300 text-gray-500"
              )}
              onClick={() => setSelectedPeriod("PM")}
            >
              PM
            </Button>
          </div>
        </div>

        {/* Hour Selection Grid */}
        <div id="hour-select" className="hidden mb-4">
          <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
            {hours.map((hour) => (
              <Button
                key={hour}
                variant={selectedHour === hour ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedHour(hour);
                  document.getElementById('hour-select')?.classList.add('hidden');
                }}
              >
                {hour}
              </Button>
            ))}
          </div>
        </div>

        {/* Minute Selection Grid */}
        <div id="minute-select" className="hidden mb-4">
          <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
            {minutes.filter(m => m % 5 === 0).map((minute) => (
              <Button
                key={minute}
                variant={selectedMinute === minute ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedMinute(minute);
                  document.getElementById('minute-select')?.classList.add('hidden');
                }}
              >
                {minute.toString().padStart(2, '0')}
              </Button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Clock size={16} />
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={onClose} className="text-primary">
              CANCEL
            </Button>
            <Button onClick={handleOk} className="text-primary bg-transparent hover:bg-primary/10">
              OK
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimePicker;