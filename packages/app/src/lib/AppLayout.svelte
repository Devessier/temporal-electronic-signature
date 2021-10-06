<script lang="ts">
	export let title: string;
</script>

<div class="flex flex-col flex-grow">
	<header>
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<h1 class="text-3xl font-bold leading-tight text-gray-900">
				{title}
			</h1>
		</div>
	</header>

	<main class="flex flex-col flex-grow">
		<div class="max-w-7xl sm:px-6 lg:px-8 flex flex-col flex-grow w-full mx-auto">
			<div class="px-4 py-8 sm:px-0 flex flex-col flex-grow">
				<slot />
			</div>
		</div>
	</main>
</div>
