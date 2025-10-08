import { Container, Title } from '@mantine/core';
import classes from './masthead.module.css';

export function Masthead() {
  return (
    <header className={classes.header}>
      <Container fluid className={classes.inner}>
        <Title order={2}>Kipu</Title>
      </Container>
    </header>
  );
}
