<script lang="ts">
	import { fade } from 'svelte/transition';
	import { useMachine } from '@xstate/svelte';
	import AppLayout from '$lib/AppLayout.svelte';
	import { uploadMachine } from '$lib/machines/upload';

	const { state, send } = useMachine(uploadMachine);
	$: selectedFile = $state.context.selectedFile;
	$: hasSelectedFile = selectedFile !== undefined;

	function handleFileChange(event: Event) {
		const target = event.target;
		if (target === null) {
			return;
		}

		const inputTarget = target as HTMLInputElement;
		const files = inputTarget.files;
		if (files === null) {
			return;
		}

		const firstFile = files.item(0);
		if (firstFile === null) {
			return;
		}

		send({
			type: 'SELECT_FILE',
			file: firstFile
		});
	}
</script>

<AppLayout title="Create procedure">
	<div class="mt-2">
		<div
			class="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"
		>
			<div class="space-y-1 text-center">
				<svg
					class="mx-auto h-12 w-12 text-gray-400"
					stroke="currentColor"
					fill="none"
					viewBox="0 0 48 48"
					aria-hidden="true"
				>
					<path
						d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>

				<div class="flex text-sm text-gray-600">
					<label
						for="file-upload"
						class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
					>
						<span>Upload a file</span>
						<input
							on:change={handleFileChange}
							id="file-upload"
							name="file-upload"
							type="file"
							accept="application/pdf"
							class="sr-only"
						/>
					</label>
					<p class="pl-1">or drag and drop</p>
				</div>

				<p class="text-xs text-gray-500">PDF only</p>
			</div>
		</div>

		{#if hasSelectedFile}
			<div
				transition:fade={{ duration: 200 }}
				class="flex items-center p-4 mt-4 space-x-2 border border-gray-200 rounded-md"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="w-5 h-5 text-green-500"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>

				<span class="text-sm font-medium text-green-700"> Fichier sélectionné </span>
			</div>
		{/if}

		<div class="pt-5">
			<div class="flex justify-end">
				<button
					type="button"
					class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					Cancel
				</button>

				<button
					type="submit"
					class="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					Save
				</button>
			</div>
		</div>
	</div>
</AppLayout>
