<?php

namespace Dakataa\Crud\Twig;

use Dakataa\Crud\Controller\AbstractCrudController;
use Exception;
use Symfony\Component\DependencyInjection\Container;
use Twig\Environment;

class TemplateProvider
{
	public function __construct(protected Environment $twig)
	{

	}

	protected function getTemplateDirectoryByClass(string $controllerClass): string
	{
		$controllerPatterns = '#Controller\\\(?<class>.+)Controller$#';
		preg_match($controllerPatterns, $controllerClass, $matches);

		if (empty($matches['class'])) {
			throw new Exception('Invalid Controller Class.');
		}

		return rtrim(
			Container::underscore(str_replace('\\', '/', preg_replace('/Action$/i', '', $matches['class']))),
			'/'
		);
	}

	protected function getTemplate(AbstractCrudController $controller, string $template, string $fallbackTemplate = null): string
	{
		if (!$this->twig) {
			throw new Exception('Missing Twig Templating Engine.');
		}

		$templatePath = sprintf(
			'crud/%s/%s.html.twig',
			$this->getTemplateDirectoryByClass($controller::class),
			$template
		);

		if (!$this->twig->getLoader()->exists($templatePath)) {
			$templatePath = sprintf('@DakataaCrudTwig/%s.html.twig', $fallbackTemplate ?: $template);
		}

		return $templatePath;
	}

	public function render(AbstractCrudController $controller, string $template, array $context, string $fallbackTemplate = null): string
	{
		return $this->twig->render($this->getTemplate($controller, $template, $fallbackTemplate), $context);
	}
}
