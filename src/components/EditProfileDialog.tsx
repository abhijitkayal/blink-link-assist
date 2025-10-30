import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  name: string;
  phone: string;
  email: string;
  address: string;
  caretakerName: string;
  caretakerPhone: string;
}

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditProfileDialog = ({ open, onOpenChange }: EditProfileDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProfileData>({
    name: "",
    phone: "",
    email: "",
    address: "",
    caretakerName: "",
    caretakerPhone: "",
  });

  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem("profileData");
      if (stored) {
        setFormData(JSON.parse(stored));
      }
    }
  }, [open]);

  const handleSave = () => {
    localStorage.setItem("profileData", JSON.stringify(formData));
    toast({
      title: "Profile updated",
      description: "Your profile has been saved successfully.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91XXXXXXXXXX"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email ID</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main St"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="caretakerName">Caretaker Name</Label>
            <Input
              id="caretakerName"
              value={formData.caretakerName}
              onChange={(e) => setFormData({ ...formData, caretakerName: e.target.value })}
              placeholder="Jane Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="caretakerPhone">Caretaker Phone Number</Label>
            <Input
              id="caretakerPhone"
              value={formData.caretakerPhone}
              onChange={(e) => setFormData({ ...formData, caretakerPhone: e.target.value })}
              placeholder="+91XXXXXXXXXX"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
