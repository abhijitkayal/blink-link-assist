import { useState } from "react";
import { UserCircle, Edit, Hospital, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import EditProfileDialog from "./EditProfileDialog";
import MedicalDetailsDialog from "./MedicalDetailsDialog";

const ProfileDropdown = () => {
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [medicalDetailsOpen, setMedicalDetailsOpen] = useState(false);

  const handleLogout = () => {
    // Future: Clerk logout
    localStorage.clear();
    window.location.href = "/signin";
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <UserCircle className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 bg-card border-border">
          <DropdownMenuItem onClick={() => setEditProfileOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMedicalDetailsOpen(true)}>
            <Hospital className="mr-2 h-4 w-4" />
            Medical Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditProfileDialog open={editProfileOpen} onOpenChange={setEditProfileOpen} />
      <MedicalDetailsDialog open={medicalDetailsOpen} onOpenChange={setMedicalDetailsOpen} />
    </>
  );
};

export default ProfileDropdown;
