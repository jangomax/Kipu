import { useEffect, useState } from "react";
import { AppShell, Autocomplete, Title, ActionIcon } from "@mantine/core";
import { IconArrowRight, IconSearch } from "@tabler/icons-react";
import router from "@/routes";

export const AppNavbar = () => {
  const initialLocation = router.state.location;
  const initialQuery = new URLSearchParams(initialLocation?.search ?? "").get("query") ?? "";
  const [value, setValue] = useState(initialQuery);
  const [showSearch, setShowSearch] = useState(
    initialLocation?.pathname?.startsWith("/app") ?? false,
  );

  useEffect(() => {
    const handleLocationChange = ({
      location,
    }: {
      location: { pathname: string; search?: string };
    }) => {
      const params = new URLSearchParams(location.search ?? "");
      setValue(params.get("query") ?? "");
      setShowSearch(location.pathname?.startsWith("/app") ?? false);
    };

    const unsubscribe = router.subscribe(handleLocationChange);

    // Ensure initial state is in sync even if no navigation occurs after mount
    handleLocationChange({ location: router.state.location });

    return unsubscribe;
  }, []);

  const handleSearch = () => {
    const trimmed = value.trim();

    if (!trimmed) {
      router.navigate("/app");
      return;
    }

    router.navigate(`/app?query=${encodeURIComponent(trimmed)}`);
  };

  return (
    <AppShell.Header
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 1rem',
        gap: '0.5rem',
      }}
    >
      <Title order={2}>Kipu</Title>
      {showSearch && (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Autocomplete
            placeholder="Search for songs"
            leftSection={<IconSearch size={16} stroke={1.5} />}
            data={[]}
            value={value}
            onChange={setValue}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSearch();
              }
            }}
          rightSection={
            <ActionIcon
              aria-label="Search"
              variant="subtle"
              color="gray"
              onClick={handleSearch}
            >
              <IconArrowRight size={16} stroke={1.5} />
            </ActionIcon>
          }
          styles={{
            root: {
              width: 'min(480px, 70vw)',
            },
            input: {
              fontSize: '0.875rem',
            },
          }}
        />
      </div>
    )}
  </AppShell.Header>
  );
};
