import { SettingsPage } from "~/ui/feature/settings/SettingsPage";
import { useSettingsData } from "~/ui/feature/settings/useSettingsData";

export default function SettingsRoute() {
	const { profile } = useSettingsData();
	return <SettingsPage profile={profile} />;
}
