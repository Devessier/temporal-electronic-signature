<script lang="ts">
	import AppLayout from '$lib/AppLayout.svelte';
	import { useAppContext } from '$lib/contexts/app';

	const { send } = useAppContext();

	let emailAddress: string = '';

	function handleSubmit() {
		send({
			type: 'SELECT_EMAIL',
			email: emailAddress
		});
	}
</script>

<AppLayout title="Email for sending code">
	<div class="flex items-center justify-center">
		<div class="max-w-md w-full space-y-8">
			<form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit}>
				<div class="rounded-md shadow-sm -space-y-px">
					<div>
						<label for="email-address" class="sr-only">Email address</label>
						<input
							id="email-address"
							bind:value={emailAddress}
							name="email"
							type="email"
							autocomplete="email"
							required
							class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
							placeholder="Email address"
						/>
					</div>
				</div>

				<div>
					<button
						type="submit"
						class="relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						Send
					</button>
				</div>
			</form>
		</div>
	</div>
</AppLayout>
