import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ChatProviderButtonProps {
  providerId: string;
  providerName: string;
  size?: "sm" | "lg" | "default";
  className?: string;
}

export const ChatProviderButton = ({ 
  providerId, 
  providerName, 
  size = "default",
  className 
}: ChatProviderButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour envoyer un message",
        variant: "destructive"
      });
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    
    try {
      // Pour l'instant, on simule l'envoi du message
      // TODO: Implémenter l'envoi réel vers la base de données
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Message envoyé",
        description: `Votre message a été envoyé à ${providerName}`,
      });

      // Reset form and close dialog
      setSubject("");
      setMessage("");
      setIsOpen(false);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi du message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size={size}
          className={`flex items-center gap-2 ${className}`}
        >
          <MessageCircle className="h-4 w-4" />
          Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Envoyer un message à {providerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium mb-2">Sujet</label>
            <Input
              placeholder="Ex: Demande de devis pour..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={sending}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <Textarea
              placeholder="Décrivez votre demande..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sending}
              rows={4}
            />
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={sending || !subject.trim() || !message.trim()}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? "Envoi..." : "Envoyer le message"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};