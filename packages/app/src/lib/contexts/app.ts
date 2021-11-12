import { appMachine } from '$lib/machines/appMachine';
import { getContext, setContext } from 'svelte';
import type { EventFrom, InterpreterFrom, MachineOptions, ContextFrom } from 'xstate';
import { interpret } from 'xstate';

const AppContextSymbol = Symbol('AppContextSymbol');

interface AppContext {
	appService: InterpreterFrom<typeof appMachine>;
}

export function useAppContextProvider(
	config?: Partial<MachineOptions<ContextFrom<typeof appMachine>, EventFrom<typeof appMachine>>>
): AppContext {
	const appService = interpret(appMachine.withConfig(config ?? {})).start();
	const context: AppContext = {
		appService
	};

	setContext(AppContextSymbol, context);

	return context;
}

export function useAppContext(): AppContext {
	const appContext = getContext<AppContext>(AppContextSymbol);
	if (appContext === undefined) {
		throw new Error('useAppContext must be used after provideAppContext');
	}

	return appContext;
}
